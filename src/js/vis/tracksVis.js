d3.afx = d3.afx || {};

d3.afx.tracks = function() {
    /**
     * Configurable defaults
     * @type {Number}
     */
    let width = 800,
        height = 800;

    const dispatch = d3.dispatch('mouseover', 'mouseout', 'click');

    function vis(selection) {
        selection.each(function(data) {
            const margin = {
                    top: height / 16,
                    right: width / 16,
                    bottom: height / 10.666,
                    left: width / 10.666
                },
                svgWidth = width - margin.left - margin.right,
                svgHeight = height - margin.top - margin.bottom;

            const xScale = d3.scale.linear()
                .domain([0, d3.max(data, d => + d.playback_count)])
                .range([ 0, svgWidth ]);

            const yScale = d3.scale.linear()
                .domain([0, d3.max(data, d => + d.votes)])
                .range([ svgHeight, 0 ]);

            const areaScale = d3.scale.pow().exponent(2)
                .domain([0, d3.max(data, d => + d.favoritings_count)])
                .range([ 10, 1500 ]);

            const opacityScale = d3.scale.linear()
                .domain([0, d3.max(data, d => + d.download_count)])
                .range([ 0.2, 1 ]);

            const chart = d3.select(this)
                .append('svg')
                .attr({
                    'class': 'chart svg-content',
                    'viewBox': '0 0 ' +
                        (svgWidth + margin.right + margin.left) + ' ' +
                        (svgHeight + margin.top + margin.bottom),
                    'preserveAspectRatio': 'xMinYMin meet'
                });

            const main = chart.append('g')
                .attr({
                    'transform': 'translate(' + margin.left + ',' + margin.top + ')',
                    'width': svgWidth,
                    'height': svgHeight,
                    'class': 'main'
                });

            const xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

            main.append('g')
                .attr('transform', 'translate(0,' + svgHeight + ')')
                .attr('class', 'main axis plays')
                .call(xAxis);

            main.append('text')
                .text('Soundcloud plays')
                .attr({
                    class :  'label labelX',
                    x: svgWidth / 2,
                    y: svgHeight + 50,
                });

            const yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

            main.append('g')
                .attr('transform', 'translate(0, 0)')
                .attr('class', 'main axis votes')
                .call(yAxis);

            main.append('text')
                .text('Fan site votes')
                .attr({
                    class :  'label labelY',
                    x: -50,
                    y: (svgHeight / 2) + 50,
                    transform: 'rotate(-90, -50, ' + ((svgHeight / 2) + 50) +')'
                });

            d3.selectAll('.axis, text')
                .attr('opacity', 0)
                .transition()
                .duration(1000)
                .attr('opacity', 1);

            const dotLayer = main.append('g');

            const dotGroups = dotLayer.selectAll('scatter-dots')
                .data(data)
                .enter()
                .append('g')
                .classed('dot', true)
                .on('mouseover', function(d) {
                    if( d3.select(this).classed('active') ) {
                        dispatch.mouseover(d, 'dot');
                        dotLayer.selectAll('.dot').sort(function (a, b) {
                            if (a.id != d.id) {
                                return -1;
                            } else {
                                return 1;
                            }
                        });
                    }
                })
                .on('mouseout', function(d) {
                    dispatch.mouseout(d, 'dot');
                })
                .on('click', function(d) {
                    dispatch.click(d, 'dot');
                });

            dotGroups.append('circle')
                .attr({
                    cx: xScale(0),
                    cy: yScale(0),
                    r: 0,
                    opacity: 0
                })
                .transition()
                .duration(1000)
                .ease('quad-in-out')
                .delay(function(d, i) {
                    return (data.length - i) * 15;
                })
                .attr({
                    cx: d => xScale(d.playback_count),
                    cy: d => yScale(d.votes),
                    r: d => Math.sqrt(areaScale(d.favoritings_count)),
                    opacity: d => opacityScale(d.download_count)
                })
                .each('end', function() {
                    d3.select(this.parentNode).classed('active', true);
                });

            dotGroups.append('image')
                .attr({
                    'xlink:href': './img/sc-arrow.svg',
                    x: d => xScale(d.playback_count),
                    y: d => yScale(d.votes),
                    width: d => Math.sqrt(areaScale(d.favoritings_count)) * 2,
                    height: d => Math.sqrt(areaScale(d.favoritings_count)) * 2,
                    transform: d =>
                        `translate(
                            ${0 - Math.sqrt(areaScale(d.favoritings_count))}
                            ${0 - Math.sqrt(areaScale(d.favoritings_count))}
                        )`
                });
        });
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

export default d3.afx.tracks;