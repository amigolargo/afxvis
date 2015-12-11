import d3 from 'd3';
import * as dataManager from './dataManager';
import rivets from 'rivets';
import tracksVis from './vis/tracksVis';
import TracksActions from './vis/tracksActions';
import audioVis from './vis/audioVis';
import AudioActions from './vis/AudioActions';
import audioBindings from './vis/audioBindings';
import followersVis from './vis/followersVis';
import FollowersActions from './vis/followersActions';


export default class VisManager {

    constructor() {
        this.tracksVisEl = document.getElementsByClassName('vis-tracks')[0];
        this.audioVisEl = document.getElementsByClassName('vis-audio')[0];
        this.followersVisEl = document.getElementsByClassName('vis-followers')[0];

        this.tracksVis = tracksVis();
        this.audioVis = audioVis();
        this.followersVis = followersVis();

        this.trackMetaData = {};
        this.tracksJSONVersion = this.tracksVisEl.getAttribute('data-jsonexport');
    }

    /**
     * Initialise the tracks visualisation
     * @param  {String} parentClass
     */
    initTracks(parentClass) {
        return new Promise((resolve, reject) => {

            const actions = new TracksActions(this.tracksVis, this.tracksVisEl, this.audioVisEl);

            dataManager.loadJSON(
                `./data/tracks-export-${this.tracksJSONVersion}.json`
            )
            .then(data => {
                d3.select('.' + parentClass).select('.svg-container')
                    .datum(data)
                    .call(this.tracksVis);

                resolve();
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Initialise the audio visualisation
     * @param  {String} parentClass
     */
    initAudio(parentClass, request) {
        return new Promise((resolve, reject) => {

            rivets.bind(document.getElementsByClassName(parentClass)[0], {track: this.trackMetaData});

            dataManager.readJsonFiles([
                `./data/echonest/${request.params.id}.json`,
                `./data/tracks-export-${this.tracksJSONVersion}.json`
            ])
            .then(json => {
                const data = json[0].segments,
                    lastSegment = data[data.length - 1],
                    trackLength = lastSegment.start + lastSegment.duration,
                    chartWidth = Math.floor(trackLength * 100);

                audioBindings(json[0], this.trackMetaData);

                d3.select('.' + parentClass)
                    .call(this.audioVis);

                this.audioVis
                    .width(chartWidth)
                    .height(document.documentElement.clientHeight)
                    .interpolate('basis')
                    .draw(data);

                this.audioActions = new AudioActions(this.audioVisEl, json[1]);
                this.audioActions.initTrack(data, request.params.id, chartWidth)
                    .then(() => resolve());
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Replay the audio visualisation
     * @param  {String} parentClass
     */
    replayAudio(parentClass, request) {

        return new Promise((resolve, reject) => {
            dataManager.loadJSON(
                `./data/echonest/${request.params.id}.json`
            )
            .then(json => {
                const data = json.segments,
                    lastSegment = data[data.length - 1],
                    trackLength = lastSegment.start + lastSegment.duration,
                    chartWidth = Math.floor(trackLength * 100);

                audioBindings(json, this.trackMetaData);

                this.audioVis
                    .width(chartWidth)
                    .height(document.documentElement.clientHeight)
                    .destroy()
                    .draw(data);

                this.audioActions.initTrack(data, request.params.id, chartWidth)
                    .then(() => resolve());
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Replay the audio visualisation
     * @param  {String} parentClass
     */
    replayTracks(parentClass, request) {
        return new Promise(function(resolve) {
            resolve();
        });
    }

    /**
     * Replay the audio visualisation
     * @param  {String} parentClass
     */
    replayFollowers(parentClass, request) {
        return new Promise(function(resolve) {
            resolve();
        });
    }

    /**
     * Initialise the followers visualisation
     * @param  {String} parentClass
     */
    initFollowers(parentClass) {
        return new Promise((resolve, reject) => {
            dataManager.readJsonFiles([
                    './data/worldcountries-edit.json',
                    './data/followers-cleaned.json'
                ])
                .then(results => {
                    d3.select('.' + parentClass).select('.svg-container')
                        .datum(results)
                        .call(this.followersVis);

                    const actions = new FollowersActions(this.followersVis, this.followersVisEl);
                    resolve();
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Replay the visualisations on second and subsequent visits
     * @param  {String} vis track | audio | followers,
     */
    replay(vis, request) {
        let func = `replay${vis.charAt(0).toUpperCase() + vis.slice(1)}`;

        return new Promise((resolve, reject) => {
            this[func]('vis-'+ vis, request).then(() => {
                resolve();
            })
        });
    }

    /**
     * Kick off the correct init function
     * @param  {String} vis track | audio | followers,
     * @return {Promise}
     */
    init(vis, request) {
        let func = `init${vis.charAt(0).toUpperCase() + vis.slice(1)}`;

        return new Promise((resolve, reject) => {
            this[func]('vis-'+ vis, request).then(() => {
                resolve();
            });
        });
    }
}