function zg(){Zipgeo({address:"94107"})}var Zipgeo=function(e){"use strict";function o(e){var o,t,i="",l="";o=new google.maps.Geocoder,o.geocode({address:e},function(e,o){if(o==google.maps.GeocoderStatus.OK){t=e[0].geometry.location,i=t.lat(),l=t.lng(),a.map.center=t,r=new google.maps.Map(document.getElementById(a.id),a.map);var n=new google.maps.Marker({map:r,position:t});if(a.mark||n.setMap(null),a.map.circle.map=r,"miles"==a.unit)var s=62137e-8;else if("kilometers"==a.unit)var s=.001;else var s=1;a.map.circle.radius=r.circle.radius/s;var c=new google.maps.Circle(a.map.circle);c.bindTo("center",n,"position")}})}console.log(1);var r,a={id:"js-map",mark:!1,unit:"miles",map:{zoom:8,center:"",zoomControl:!1,mapTypeControl:!1,streetViewControl:!1,rotateControl:!1,scrollwheel:!1,navigationControl:!1,scaleControl:!1,draggable:!1,circle:{fillColor:"#AA0000",strokeColor:"#FF0000",strokeOpacity:.8,strokeWeight:0,radius:15}}};o(e.address)};
//# sourceMappingURL=maps/bundle.example_20151230030338.js.map
