(function () {


  Reveal.configure({
    keyboard: {
      67: function () {
        const controls = Reveal.getConfig().controls;

        Reveal.configure({ controls: !controls });

        document.documentElement.classList.toggle("controls", !controls);

        const videos = document.getElementsByTagName('video');
        for (var i = 0; i < videos.length; i++) {
          videos[i].controls = !controls;
        }

      }
    }
  })
})();
