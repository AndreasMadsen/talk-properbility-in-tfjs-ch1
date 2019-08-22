(async function () {
    const d3 = window.require('d3');
    const tf = window.require('@tensorflow/tfjs-core');

    const plotElement = document.getElementById('tf-intro-plot');
    const codeElement = document.getElementById('tf-intro-code');
    const outputElement = document.getElementById('tf-intro-output');
    const section = document.currentScript.parentNode;

    const variety2index = new Map([
        ['Setosa', 0],
        ['Versicolor', 1],
        ['Virginica', 2]
    ]);

    function parseIrisRow(row) {
        return {
            'pc1': parseFloat(row['pc.1']),
            'pc2': parseFloat(row['pc.2']),
            'sepalLength': parseFloat(row['sepal.length']),
            'sepalWidth': parseFloat(row['sepal.width']),
            'petalLength': parseFloat(row['petal.length']),
            'petalWidth': parseFloat(row['petal.width']),
            'variety': row['variety']
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    class Plot {
        constructor(meshSize) {
        const margin = {top: 30, right: 50, bottom: 40, left:40};
        const width = 350 - margin.left - margin.right;
        const height = 350 - margin.top - margin.bottom;
        this._meshSize = meshSize;

        const canvas = d3.select(plotElement)
            .append('canvas')
            .attr('width', this._meshSize)
            .attr('height', this._meshSize)
            .style('width', `${width}px`)
            .style('height', `${height}px`)
            .style('top', `${margin.top}px`)
            .style('left', `${margin.left}px`)
            .node();
        this._ctx = canvas.getContext('2d');

        this._svg = d3.select(plotElement)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
        .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        this._textNode = d3.select(plotElement)
            .append('div');

        this._xScale = d3.scaleLinear()
            .range([0, width])
            .domain([-4, 4])
            .nice();

        this._yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([-4, 4])
            .nice();

        const xAxis = d3.axisBottom()
            .scale(this._xScale);

        const yAxis = d3.axisLeft()
            .scale(this._yScale);

        this._color = d3.scaleOrdinal()
            .domain(['Setosa', 'Versicolor', 'Virginica'])
            .range(['#66c2a5', '#fc8d62', '#8da0cb']);

        this._svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .attr('class', 'x axis')
            .call(xAxis);

        this._svg.append('g')
            .attr('transform', 'translate(0,0)')
            .attr('class', 'y axis')
            .call(yAxis);
        }

        drawPoints(data) {
            this._svg.selectAll('.bubble')
                .data(data)
                .enter().append('circle')
                .attr('class', 'bubble')
                .attr('cx', (d) => this._xScale(d.pc1))
                .attr('cy', (d) => this._yScale(d.pc2))
                .attr('r', 3)
                .style('fill', (d) => this._color(d.variety));
        }

        setCanvasContent(data) {
            this._ctx.putImageData(new ImageData(
                new Uint8ClampedArray(data),
                this._meshSize, this._meshSize
            ), 0, 0);
        }

        setText(text) {
            this._textNode.text(text);
        }
    }

    class Model {
        constructor() {
            this._classToColor = tf.tensor([
                [0x66, 0xc2, 0xa5, 0xff],
                [0xfc, 0x8d, 0x62, 0xff],
                [0x8d, 0xa0, 0xcb, 0xff]
            ]);

            this._w1 = tf.variable(
                tf.randomUniform([2, 5], -0.93, 0.93, 'float32', 0)
            );
            this._w2 = tf.variable(
                tf.randomUniform([5, 3], -0.83, 0.83, 'float32', 1)
            );
        }

        reset() {
            this._w1.assign(tf.randomUniform([2, 5], -0.93, 0.93, 'float32', 0));
            this._w2.assign(tf.randomUniform([5, 3], -0.83, 0.83, 'float32', 1));
        }

        forward(x, w1, w2) {
            return x.matMul(w1).tanh().matMul(w2);
        }

        loss(x, t, w1, w2) {
            const z = this.forward(x, w1, w2);
            return tf.losses.softmaxCrossEntropy(t, z).mean();
        }

        output(x) {
            return this.forward(x, this._w1, this._w2).softmax();
        }

        colorize(x) {
            return this.output(x).matMul(this._classToColor).cast('int32');
        }

        update(x, t) {
            const grad = tf.valueAndGrads((w1, w2) => this.loss(x, t, w1, w2));
            const {
                value: loss,
                grads: [dLdw1, dLdw2]
            } = grad([this._w1, this._w2]);

            this._w1.assign(this._w1.sub(dLdw1.mul(0.2)));
            this._w2.assign(this._w2.sub(dLdw2.mul(0.2)));

            return loss;
        }
    }

    class Dataset {
        constructor(meshSize) {
            this.meshSize = meshSize;
        }

        async load() {
            this.irisData = await d3.csv('slides/tf-intro/iris-pc.csv', parseIrisRow);

            this.irisX = tf.tensor(this.irisData.map((d) => [
                d.pc1,
                d.pc2
            ]));

            this.irisT = tf.tensor(this.irisData.map((d) => [
                variety2index.get(d.variety) === 0,
                variety2index.get(d.variety) === 1,
                variety2index.get(d.variety) === 2
            ]));

            const meshSize = this.meshSize;
            this.xMeshGrid = tf.tensor((function () {
                const xRange = tf.linspace(-3.9, 3.9, meshSize).arraySync();
                const yRange = tf.linspace(3.9, -3.9, meshSize).arraySync();
                const values = [];
                for (const y of yRange) {
                    for (const x of xRange) {
                        values.push([x, y]);
                    }
                }
                return values;
            })());
        }
    }

    class Code {
        showFragment(fragmentIndex) {
            d3.select(codeElement)
                .selectAll('.extra-fragment')
                .classed('extra-fragment-visible', function () {
                    return (+this.dataset.fragmentIndex) === fragmentIndex;
                });
        }
    }

    class Output {
        showFragment(fragmentIndex) {
            d3.select(outputElement)
                .selectAll('.extra-fragment')
                .classed('extra-fragment-visible', function () {
                    return (+this.dataset.fragmentIndex) === fragmentIndex;
                });
        }
    }

    class State {
        constructor(dataset) {
            this._dataset = dataset;
            this._plot = new Plot(dataset.meshSize);
            this._iteration = 0;
            this._model = new Model();
            this._code = new Code();
            this._output = new Output();

            this._plot.drawPoints(this._dataset.irisData);

            this._isPaused = true;
            this._maxIterations = 100;
            this._animatorTimer = null;
        }

        async updateCanvas() {
            this._plot.setCanvasContent(
                await this._model.colorize(this._dataset.xMeshGrid).data()
            );
        }

        async set (stateIndex) {
            this._code.showFragment(stateIndex);
            this._output.showFragment(stateIndex);

            if (stateIndex === 0) {
                this.clear();
            } else if (stateIndex === 1) {
                await this.reset();
            } else if (stateIndex === 2) {
                this.pause();
                await this.reset();
            } else if (stateIndex === 3) {
                this.pause();
                await this.reset();
            } else if (stateIndex === 4) {
                this.resume();
            }
        }

        async animator () {
            const loss = await this._model.update(
                this._dataset.irisX,
                this._dataset.irisT
            ).array();
            if (this._isPaused) return;

            this._iteration += 1;
            await this.updateCanvas();
            this._plot.setText(`iteration: ${this._iteration}, loss: ${loss.toFixed(2)}`);

            if (this._iteration < this._maxIterations) {
                this._animatorTimer = setTimeout(this.animator.bind(this), 100);
            }
        };

        clear() {
            this._plot.setCanvasContent(
                new Uint8ClampedArray(this._dataset.meshSize * this._dataset.meshSize * 4)
            );
            this._plot.setText(``);
        }

        async reset () {
            this._iteration = 0;
            this._model.reset();

            await this.updateCanvas();
            this._plot.setText(``);
        }

        pause () {
            this._isPaused = true;
            clearTimeout(this._animatorTimer);
        }

        resume () {
            this._isPaused = false;
            this.animator();
        }

        getFragmentIndex() {
            const activeFragments = section
                .querySelectorAll('.fragment.visible.current-fragment');
            if (activeFragments.length > 0) {
                return +activeFragments[0].dataset.fragmentIndex + 1;
            }
            return 0;
        }

        listen() {
            Reveal.addEventListener('fragmentshown', async (event) => {
                if (event.fragment.parentNode.id !== 'tf-intro-logic') return;
                await this.set(this.getFragmentIndex());
            });

            Reveal.addEventListener('fragmenthidden', async (event) => {
                if (event.fragment.parentNode.id !== 'tf-intro-logic') return;
                await this.set(this.getFragmentIndex());
            });

            Reveal.addEventListener('slidechanged', async (event) => {
                if (event.previousSlide === section) {
                    this.pause();
                } else if (event.currentSlide === section) {
                    await this.set(this.getFragmentIndex());
                }
            });
        }
    }

    const dataset = new Dataset(39);
    await dataset.load();
    const state = new State(dataset);
    await state.set(state.getFragmentIndex());
    state.listen();
})();
