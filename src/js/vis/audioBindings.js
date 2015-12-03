export default function audioBindings(data, obj) {
	const keys = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']

	obj.title = data.meta.title;
	obj.tempo = data.track.tempo;
	obj.key = keys[data.track.key];
	obj.mode = data.track.mode === 0 ? 'major' : 'minor';
	obj.timeSig = data.track.time_signature + '/4';

	if (obj.timeSig === 1) {
		obj.timeSig = 'complex'
	} else if(obj.timeSig === -1) {
		obj.timeSig = 'none'
	}
}