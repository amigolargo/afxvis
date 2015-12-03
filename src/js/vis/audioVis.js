import chroma from 'chroma-js';

d3.afx = d3.afx || {};

d3.afx.audio = function() {

    /**
     * Configurable defaults
     * @type {Number}
     */
    let width = 48000,
        height = 1400,
        interpolate = 'cardinal',       // 'cardinal' || 'step-before'
        offset = 'expand';              // 'expand' || 'silhouette'

    const dispatch = d3.dispatch('mouseover', 'mouseout', 'click');

    function exports(selection) {
        selection.each(function(data) {


            console.log(data);


            const dataset = [],
                stack = d3.layout.stack()
                    .offset(offset)
                    .values(d => d.intensities)
                    .order('reverse');

            data[0].pitches.forEach((pitch, i) => {
                dataset[i] = {
                    pitch: 'pitch' + i,
                    intensities: []
                };

                data.forEach((datum, j) => {
                    let amount = data[j].pitches[i] ? + data[j].pitches[i] : null;
                    dataset[i].intensities.push({
                        x: data[j].start,
                        y: amount
                    });
                });
            });

            stack(dataset);

            const svg = d3.select(this)
                .append('svg')
                .attr({
                    'width': width,
                    'height': height
                });

            const xScale = d3.time.scale().range([0, width]),
                yScale = d3.scale.linear().range([0, height]),
                color = chroma.scale(['#023699','#026bad','#0fa5c0','#42b899','#94d275','#d6f36d']).domain([1,0]),
                totals = [];

            let maxTime = 0;

            data.forEach((datum, i) => {
                totals[i] = 0;
                maxTime = data[i].start > maxTime ? data[i].start : maxTime;
                dataset.forEach((datum, j) => {
                    let intensity = dataset[j].intensities[i].y;
                    totals[i] += intensity;
                });
            });

            yScale.domain([ d3.max(totals), 0 ]);
            xScale.domain([ 0, maxTime]);

            const area = d3.svg.area()
                .interpolate(interpolate)
                .x(d => xScale(d.x))
                .y0(d => yScale(d.y0))
                .y1(d => yScale(d.y0 + d.y));

            const paths = svg.selectAll('path')
                .data(dataset)
                .enter()
                .append('path')
                .attr({
                    class: (d, i) => 'area area' + i,
                    d: (d, i) => area(d.intensities),
                    fill: (d, i) => color(i / 12).hex(),
                    stroke: 'none'
                });
        });
    }

    exports.width = function(arg = width) {
        width = arg;
        return this;
    };

    exports.height = function(arg = height) {
        height = arg;
        return this;
    };

    exports.offset = function(arg = offset) {
        offset = arg;
        return this;
    };

    exports.interpolate = function(arg = interpolate) {
        interpolate = arg;
        return this;
    };

    d3.rebind(exports, dispatch, 'on');

    return exports;
};

export default d3.afx.audio;