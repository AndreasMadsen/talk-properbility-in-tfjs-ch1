(function () {
    const section = document.currentScript.parentNode;

    function getFragmentIndex() {
        const activeFragments = section
            .querySelectorAll('.fragment.visible.current-fragment');
        if (activeFragments.length > 0) {
            return +activeFragments[0].dataset.fragmentIndex + 1;
        }
        return 0;
    }

    Reveal.addEventListener('fragmentshown', function(event) {
        if (event.fragment.parentNode.id !== 'digamma-page-2-logic') return;
        setPosition(getFragmentIndex());
    });

    Reveal.addEventListener('fragmenthidden', function(event) {
        if (event.fragment.parentNode.id !== 'digamma-page-2-logic') return;
        setPosition(getFragmentIndex());
    });

    Reveal.addEventListener('slidechanged', function(event) {
        if (event.currentSlide === section) {
            setPosition(getFragmentIndex());
        }
    });

    const img = section.querySelector('.img');
    function setPosition(stateIndex) {
       img.setAttribute('data-position', stateIndex);
    }
})();
