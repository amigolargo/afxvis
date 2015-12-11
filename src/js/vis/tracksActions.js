import d3 from 'd3';

export default class TracksActions {
    constructor(vis, el, audioVisEl) {
        this.vis = vis;
        this.audioVisEl = audioVisEl;
        this.titles = el.getElementsByClassName('title');
        this.subtitles = el.getElementsByClassName('subtitle');

        this.init();
    }
    dotOver(d) {
        let dateArr = d.uploaded_at.split(' ');

        this.titles[0].textContent = d.title;
        this.titles[1].textContent = dateArr[0] + ' ' + dateArr[1];
        this.titles[2].textContent = 'Votes:' + d.votes;
        this.titles[3].textContent = 'Plays:' + d.playback_count;
        this.titles[4].textContent = 'Favourites:' + d.favoritings_count;
        this.titles[5].textContent = 'Downloads:' + d.download_count;

        for (let title of this.subtitles) {
            title.classList.add('subtitle-bold');
        }
    }
    dotOut(d) {
        for (let title of this.titles) {
            title.textContent = title.getAttribute('data-defaulttext');
        }

        for (let title of this.subtitles) {
            title.classList.remove('subtitle-bold');
        }
    }
    dotClick(d) {
        window.location.hash = '/audio/' + d.en_id;
        this.audioVisEl.setAttribute('data-mp3', d.filename);
    }
    init() {

        for (let title of this.titles) {
            title.setAttribute('data-defaulttext', title.textContent);
        }

        this.vis.on('mouseover.dot', d => this.dotOver(d));
        this.vis.on('mouseout.dot', d => this.dotOut(d));
        this.vis.on('click.dot', d => this.dotClick(d));
    }
}