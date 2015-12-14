import d3 from 'd3';
import cartogram from '../lib/cartogram'; // unavailable as npm package
import topojson from 'topojson';
import chroma from 'chroma-js';

d3.afx = d3.afx || {};

d3.afx.followers = function() {
    /**
     * Configurable defaults
     * @type {Number}
     */
    let width = 1000,
        height = 500,
        topology,
        cartogram,
        projection,
        geometries,
        worldcountries,
        totalFollowers,
        colors;

    const dispatch = d3.dispatch('mouseover');

    function vis(selection) {
        selection.each(function(data) {

            cartogram = d3.cartogram();
            topology = data[0];
            geometries = topology.objects.worldcountries.geometries;
            projection = d3.geo.equirectangular();
            totalFollowers = 83100;     // TODO fix this up to live data
            colors = chroma.scale([
                        'rgba(255,255,255,0.2)',
                        'rgba(255,255,255,1)'
                    ])
                    .classes(7);

            const followerData = data[1],
                path = d3.geo.path().projection(projection),
                map = d3.select(this).append('svg')
                    .attr({
                        'viewBox': '0 0 1000 500',
                        'preserveAspectRatio': 'xMinYMin meet'
                        // 'width': 1000,
                        // 'height': 500
                    }),
                layer = map.append('g').attr('id', 'layer')
                    .attr({
                        'transform': 'scale(1.2) translate(-70,0)'
                    });

            cartogram.projection(projection)
                .properties(function(d) {               // set the cartogram projection properties of each country
                    var props = followerData[d.id],
                        perCapita = props.followers / props.population;

                    props.perCapita = props.followers ? perCapita : 0;

                    return followerData[d.id];          // to our follower data object, matched by ID
                });

            worldcountries = layer.append('g')
                    .selectAll('path')
                    .attr('id', 'worldcountries');

            let features = cartogram.features(topology, geometries),
                sampleSize = 0;

            worldcountries = worldcountries.data(features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('id', function(d) {
                    sampleSize += d.properties.followers;   // increment our sample size
                    return d.id;                            // return the 2 digit ISO code
                })
                .attr('fill', 'rgba(255,255,255,0.25)')
                .attr('d', path);

            worldcountries.on('mouseenter', function(d) {

                layer.selectAll('.country').sort(function (a, b) {
                    if (a.id != d.id) {
                        return -1;
                    } else {
                        return 1;
                    }
                });

                d3.selectAll('.country').classed('active', false);
                d3.select(this).classed('active', true);

                dispatch.mouseover({
                    count: d.properties.followers * Math.floor(totalFollowers / sampleSize),
                    country: d.properties.name
                });
            });

        });
    }

    vis.updateMap = function(key) {
        let value = function(d) {
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
            high = values[values.length - 1],                   // to create our scale
            scale = d3.scale.linear()                           // the min/max scale for our cartogram
                .domain([low, (low + high) / 2, high])
                .range([5, 750]),
            colorScale = d3.scale.linear()
                .domain([low, (low + high) / 2, high])
                .range([0, 1]);

        cartogram.value(function(d) {                               // tell the cartogram to use our scale
            return isNaN(scale(value(d))) ? 0 : scale(value(d));
        });

        let features = cartogram(topology, geometries).features;    // generate the new features, pre-projected

        worldcountries
            .data(features)                                         // update the data
            .transition()
            .duration(2000)
            .ease('bounce-in')
            .attr('fill', d => {
                var color = colors(colorScale(value(d)));
                return 'rgba(' + color.rgb() + ', ' + color.alpha() + ')';
            })
            .attr({
                'stroke': 'rgba(255, 255, 255, 0.25)',
                'd': cartogram.path
            })

        return this;
    }

    vis.resetMap = function() {
        let features = cartogram.features(topology, geometries),
            path = d3.geo.path().projection(projection);

        worldcountries.data(features)
            .transition()
            .duration(2000)
            .ease('bounce-in')
            .attr({
                'fill':'rgba(255, 255, 255, 0.2)',
                'd': path
            })

        return this;
    }

    vis.width = function(x = width) {
        width = x;
        return this;
    };

    vis.height = function(y = height) {
        height = y;
        return this;
    };

    d3.rebind(vis, dispatch, 'on');

    return vis;
};

export default d3.afx.followers;