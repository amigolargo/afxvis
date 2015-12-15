import doT from 'dot';

/**
 * Load dot.js template view via XHR
 * @param  {String} template [template name without suffix]
 * @return {Promise}
 */
function loadView(template) {

	return new Promise(function(resolve, reject) {

		var request = new XMLHttpRequest();
		request.open('GET', './views/' + template + '.html', true);

		request.onreadystatechange = function() {
			if (request.readyState != 4 || request.status != 200) {
				return;
			}
			resolve(request.responseText);
		};

		request.onerror = function() {
			reject(Error('Network Error'));
		};

		request.send();
  });
}

/**
 * Render the loaded dot.js template file
 * @param  {Object} params {elem, view} DOM el, String
 */
function renderView(params) {

	let data = params.data || {},
		partials = params.partials || {},
		pagefn = doT.template(params.template, undefined, partials);

	params.elem.innerHTML = pagefn(params.data);
}

/**
 * Load and render a view template
 * @param  {Object} params {elem, view} DOM el, String
 * @return {Promise}
 */
function loadAndRender(params) {
	return new Promise(function(resolve, reject) {
		if(params.elem.innerHTML.length > 0) {
			resolve('cached');
		} else {
			loadView(params.view).then(text => {
				renderView({
					template: text,
					elem: params.elem
					// TODO add data param
				});
				resolve('loaded');
			});
		}
	});
}


export { loadView, renderView, loadAndRender };