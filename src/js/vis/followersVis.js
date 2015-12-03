import d3 from 'd3';
import cartogram from '../lib/cartogram'; // in lib because not available as npm package
import topojson from 'topojson';
import chroma from 'chroma-js';

d3.afx = d3.afx || {};

d3.afx.followers = function() {
    /**
     * Configurable defaults
     * @type {Number}
     */
    let width = 1000,
        height = 500;

    function exports(selection) {
        selection.each(function(data) {


            var topology = data[0],
                followerData = data[1],
                geometries = topology.objects.worldcountries.geometries,
                carto = d3.cartogram(),
                proj = d3.geo.equirectangular(),
                path = d3.geo.path().projection(proj),
                body = d3.select('body'),
                buttons = document.querySelectorAll('button'),
                map = d3.select(this).append('svg')
                    .attr({
                        'viewBox': '0 0 1000 500',
                        'preserveAspectRatio': 'xMinYMin meet',
                        'class': 'svg-content'
                    }),
                layer = map.append('g').attr('id', 'layer')
                    .attr({
                        'transform': 'scale(1.2) translate(-70,0)'
                    }),
                worldcountries = layer.append('g')
                    .selectAll('path')
                    .attr({
                        'id': 'worldcountries'
                    }),
                colors = chroma.scale(['rgba(255,255,255,0.2)','rgba(255,255,255,1)'])
                    .classes(7),
                h3El = document.getElementsByTagName('h3')[0],
                h4El = document.getElementsByTagName('h4')[0],
                totalFollowers = 79855,     // TODO fix this up to live data
                sampleSize = 0;


            carto.projection(proj)
                .properties(function(d) {               // set the cartogram projection properties of each country
                    var props = followerData[d.id],
                        perCapita = props.followers / props.population;

                    props.perCapita = props.followers ? perCapita : 0;

                    return followerData[d.id];          // to our follower data object, matched by ID
                });

            let features = carto.features(topology, geometries);

            worldcountries = worldcountries.data(features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('id', function(d) {
                    sampleSize += d.properties.followers;   // increment our sample size

                    return d.id;                // return the 2 digit ISO code
                })
                .attr('fill', 'rgba(255,255,255,0.25')
                .attr('d', path);

            for (var i = 0; i < buttons.length; i++){
                var btn = buttons[i];

                btn.onclick = chooseKey;
            }

            function chooseKey(e) {
                var el = e.target,
                    key = el.getAttribute('data-key');

                for (var i = 0; i < buttons.length; i++){
                    var btn = buttons[i];

                    btn.classList.remove('active');
                }

                el.classList.add('active');

                if(key === 'none') {
                    resetMap();
                } else {
                    updateMap(key);
                }

                return false;
            }

            worldcountries.on('mouseenter', function(d) {
                    h3El.innerHTML = d.properties.name + ':';
                    h4El.innerHTML = d.properties.followers * Math.floor(totalFollowers / sampleSize) + ' followers <sup>*</sup>';

                    layer.selectAll('.country').sort(function (a, b) {
                        if (a.id != d.id) {
                            return -1;
                        } else {
                            return 1;
                        }
                    });

                    d3.selectAll('.country').classed('active', false);
                    d3.select(this).classed('active', true);
                });

            setTimeout(function(){
                let el = buttons[0];
                el.click();
            }, 500);



            function updateMap(key) {

                var value = function(d) {
                        if (isNaN(d.properties[key])) {
                            console.log(d);
                        }
                        return +d.properties[key];                      // get the property as per our button
                    },
                    values = worldcountries.data()                      // create an array of ascending values
                        .map(value)
                        .filter(function(n) {
                            return !isNaN(n);
                        })
                        .sort(d3.ascending),
                    low = values[0],                                    // set low and high values from the array
                    high = values[values.length - 1];                   // to create our scale

                var scale = d3.scale.linear()                           // the min/max scale for our cartogram
                    .domain([low, (low + high) / 2, high])
                    .range([5, 750]);

                var colorScale = d3.scale.linear()
                    .domain([low, (low + high) / 2, high])
                    .range([0, 1]);

                carto.value(function(d) {                               // tell the cartogram to use our scale
                    return isNaN(scale(value(d))) ? 0 : scale(value(d));
                });

                var features = carto(topology, geometries).features;    // generate the new features, pre-projected

                worldcountries
                    .data(features)                                     // update the data
                    .transition()
                    .duration(2000)
                    .ease('bounce-in')
                    .attr('fill', function(d) {
                        var color = colors(colorScale(value(d)));
                        return 'rgba(' + color.rgb() + ', ' + color.alpha() + ')';
                    })
                    .attr('stroke', 'rgba(255, 255, 255, 0.25)')
                    .attr('d', carto.path);
            }

            function resetMap() {

                var features = carto.features(topology, geometries),
                    path = d3.geo.path().projection(proj);

                worldcountries.data(features)
                    .transition()
                    .duration(2000)
                    .ease('bounce-in')
                    .attr('fill', 'rgba(255, 255, 255, 0.2)')
                    .attr('d', path);

            }
        });
    }

    exports.width = function(x = width) {
        width = x;
        return this;
    };

    exports.height = function(y = height) {
        height = y;
        return this;
    };

    return exports;
};

export default d3.afx.followers;