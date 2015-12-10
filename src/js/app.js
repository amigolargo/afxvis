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
    '' : request => {
        request.match.input = '/tracks',
        navigation.goto(request)
    },
    '/' : request => {
        request.match.input = '/tracks',
        navigation.goto(request)
    },
    '/audio' : request => {
        request.params.id = trackId;
        request.match.input = '/audio/' + trackId,
        navigation.goto(request)
    },
    '/tracks' : request => navigation.goto(request),
    '/audio/:id' : request => {
        trackId = request.params.id;
        navigation.goto(request);
    },
    '/followers' : request => navigation.goto(request),
    '/*' : (request, event) => {
        if(!event.parent()) {
            // Handle 404
        }
    }
}

Grapnel.listen(routes);