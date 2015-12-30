var Zipgeo = function(config) {
  'use strict';
  console.log(1);
  var options = {
    id: 'js-map',
    mark: false,
    unit: 'miles', // miles | kilometers | meters
    map: {
      zoom: 8,
      center: '',
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      rotateControl: false,
      scrollwheel: false,
      navigationControl: false,
      scaleControl: false,
      draggable: false,
      circle: {
        fillColor: '#AA0000',
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 0,
        radius: 15,
      }
    }
  };

  var map;

  function init(address) {
    var geocoder;
    var location;
    var lat = '';
    var lng = '';

    geocoder = new google.maps.Geocoder();
    geocoder.geocode({
      'address': address
    }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        location = results[0].geometry.location;

        // Get Latitude and Longitude
        lat = location.lat();
        lng = location.lng();

        // Update map configs
        options.map.center = location;

        // Create map object
        map = new google.maps.Map(
          document.getElementById(options.id), options.map
        );

        // Create marker object
        var marker = new google.maps.Marker({
          map: map,
          position: location
        });

        // Remove marker from the map
        if (!options.mark) { marker.setMap(null); }

        // Update map circle configs
        options.map.circle.map = map;
        if (options.unit == 'miles') {
          var conversion = 0.00062137;
        } else if (options.unit == 'kilometers') {
          var conversion = 0.001;
        } else {
          var conversion = 1;
        }
        options.map.circle.radius = map.circle.radius / conversion;

        // Add circle overlay and bind to marker
        var circle = new google.maps.Circle(options.map.circle);
        circle.bindTo('center', marker, 'position');
      }
    });
  };

  init(config.address);
};
