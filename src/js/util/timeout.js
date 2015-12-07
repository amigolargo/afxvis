/**
 * This module will wait for the specified time (in seconds)
 * and then resolve its promise;
 *
 * @param duration Time to wait in seconds
 * @return promise
 */
export default function timeout(duration) {
    return new Promise(function(resolve) {
    	setTimeout(function() {
        	resolve();
    	}, duration * 1000);
    });
};
