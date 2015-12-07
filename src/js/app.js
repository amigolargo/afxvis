import Grapnel from 'grapnel';
import Navigation from './navigation';

/**
 * New Grapnel router & navigation instance
 */
const router = new Grapnel({ pushState : false }),
    navigation = new Navigation(document.querySelector('nav'));

/**
 * Define Grapnel routes
 */
var routes = {
    '' : request => router.navigate('/tracks'),
    '/' : request => router.navigate('/tracks'),
    '/tracks' : request => navigation.goto(request),
    '/audio/:id' : request => navigation.goto(request),
    '/followers' : request => navigation.goto(request),
    '/*' : (request, e) => {
        if(!e.parent()) {
            // Handle 404
        }
    }
}

Grapnel.listen(routes);