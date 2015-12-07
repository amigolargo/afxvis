import d3 from 'd3';

export default class FollowersActions {
    constructor(vis, el) {
        this.vis = vis;
        this.buttons = el.querySelectorAll('button');

        this.h3El = el.getElementsByTagName('h3')[0],
        this.h4El = el.getElementsByTagName('h4')[0],

        this.init();
    }
    countryOver(d) {
        this.h3El.innerHTML = d.country + ':';
        this.h4El.innerHTML = d.count + ' followers <sup>*</sup>';
    }
    updateMapKey(e) {
        let el = e.target,
            key = el.getAttribute('data-key');

        Array.from(this.buttons).forEach((button, index) => {
            button.classList.remove('active');
        });

        el.classList.add('active');

        if(key === 'none') {
            this.vis.resetMap();
        } else {
            this.vis.updateMap(key);
        }

        return false;
    }
    init() {
        var _this = this;

        this.updateMapKey = this.updateMapKey.bind(this);

        Array.from(this.buttons).forEach((button, index) => {
            button.onclick = _this.updateMapKey;
        });

        setTimeout(function() {
            let button = _this.buttons[0];
            button.click();
        }, 500);

        this.vis.on('mouseover.country', d => this.countryOver(d));
    }
}