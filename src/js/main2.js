import d3 from 'd3';
import SC from 'soundcloud';
import chroma from 'chroma-js';
import _ from 'lodash';
import * as dataManager from './dataManager';
import stacked from './stacked';


dataManager.loadJSON('./data/28-organ-analysis.json')
	.then(json => {

		const data = json.segments,
			lastSegment = data[data.length - 1],
			trackLength = lastSegment.start + lastSegment.duration,
			chartWidth = Math.floor(trackLength * 100),
			chart = stacked()
				.width(chartWidth)
				.height(document.documentElement.clientHeight);

	    d3.select('body')
	       	.datum(data)
	        .call(chart);

		const $svg = document.getElementsByTagName('svg')[0],
			$info = document.getElementById('js-info'),
			$bars = document.querySelectorAll('.bars li'),
			$progress = document.getElementsByTagName('progress')[0],
			$playBtn = document.querySelectorAll('.info button')[0],
			$cloneBars = document.querySelectorAll('.bars-clone li'),
			color = chroma.scale(['#023699','#026bad','#0fa5c0','#42b899','#94d275','#d6f36d']).domain([1,0]);

		let chartHeight = document.documentElement.clientHeight,
			trackIsPlaying = false,
			startTime,
			progress,
			elapsed;

		Array.from($bars).forEach(($bar, index) => {
			$bar.style.backgroundColor = color(index % 12 / 12).hex();
		});

		function sizeBars($collection, pitches, pitchTotal) {
			pitches.forEach((pitch, i) => {
				Array.from($collection)[i].style.height = pitch / pitchTotal * 100 + '%';
			});
		}

		function checkProgress(player, sound) {

			if(player.currentTime() > 0 && !trackIsPlaying) {
				startTime = new Date();
				trackIsPlaying = true;

				let transformStyle = 'translate3d(-'+ chartWidth + 'px, 0, 0)';

				$svg.style.transform = transformStyle;						// todo get transform property dynamically,
				$cloneBars[0].parentNode.style.transform = transformStyle;	// ie Modernizr
			}

			if(player.currentTime() > 0) {
				elapsed = new Date() - startTime;
				progress = elapsed / sound.duration;
			}

			$progress.setAttribute('value', progress * 100);

			let segment = _.first(_.map(_.dropWhile(data, (n) => {
				return n.start <= (elapsed / 1000);
			})));

			let pitchTotal = segment.pitches.reduce((total, n) => total + n, 0);;

			if(segment.start >= elapsed / 1000) {
				sizeBars($bars, segment.pitches, pitchTotal);
			}

			if(player.currentTime() === 0) {
				sizeBars($bars, segment.pitches, pitchTotal);
				sizeBars($cloneBars, segment.pitches, pitchTotal);
			}

		  	requestAnimationFrame(function(){
		  		checkProgress(player, sound);
		  	});
		}

		SC.initialize({
			client_id: 'dee9c614f1df6a61b84fa1c05db82b07',
		});

		SC.get('tracks/188406785').then(function(sound) {
			SC.stream('tracks/188406785').then(function(player) {
				requestAnimationFrame(function(){
					checkProgress(player, sound);
				});

				$playBtn.addEventListener('click', function() {
					player.play();
				}, false);
			});
		});
	})
	.catch(error => {
	    console.log(error);
	});