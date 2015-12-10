import Grapnel from 'grapnel';
import Navigation from './navigation';

/**
 * New Grapnel router & navigation instance
 */
const router = new Grapnel({ pushState : false }),
    navigation = new Navigation(document.querySelector('nav'));

let trackId = document.getElementsByClassName('vis-audio')[0].getAttribute('data-defaultid');

/**
 * Define Grapnel routes
 */
var routes = {
    '' : request => router.navigate('/tracks'),
    '/' : request => router.navigate('/tracks'),
    '/audio' : request => router.navigate('/audio/' + trackId),
    '/tracks' : (request, event) => navigation.goto(request, event),
    '/audio/:id' : (request, event) => {
        trackId = request.params.id;
        navigation.goto(request, event);
    },
    '/followers' : (request, event) => navigation.goto(request, event),
    '/*' : (request, event) => {
        if(!event.parent()) {
            // Handle 404
        }
    }
}

Grapnel.listen(routes);