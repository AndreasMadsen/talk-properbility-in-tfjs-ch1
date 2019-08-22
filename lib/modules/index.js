
const modules = {
  'd3': require('./d3.js'),
  '@tensorflow/tfjs-core': require('@tensorflow/tfjs-core'),
  'tfjs-special': require('./tfjs-special.min.js')
};

window.require = function (name) {
  if (modules.hasOwnProperty(name)) {
    return modules[name];
  }

  throw new Error('module ' + name + ' not bundled');
};
