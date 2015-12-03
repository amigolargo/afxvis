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
    '/tracks' : request => navigation.initSlide(request),
    '/audio/:id' : request => navigation.initSlide(request),
    '/followers' : request => navigation.initSlide(request),
    '/*' : (request, e) => {
        if(!e.parent()) {
            // Handle 404
        }
    }
}

Grapnel.listen(routes);