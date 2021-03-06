/* jshint esversion: 6 */
const ga = window.ga || function () {};
const Hammer = window.Hammer || function () {};



const setCookie = function (cname, cvalue, exdays) {

    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));

    var expires = `expires=${d.toUTCString()}`;

    document.cookie = `${cname}=${cvalue}; ${expires}; path=/`;

};



const getCookie = function (cname) {

    let name = `${cname}=`;
    let ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    return '';

};



const isDesktop = function () {
    return window.matchMedia('(min-width: 768px)').matches;
};



const forEach = function (array, callback, scope) {

    for (let i = 0; i < array.length; i++) {
        callback.call(scope, i, array[i]); // passes back stuff we need
    }

};



const Comic = function (comicNode) {

    // TODO page transitions in out
    // TODO preload images

    const comicZoomNode = comicNode.querySelector('.js-comic-wrapper-zoom');
    const comicPositionNode = comicNode.querySelector('.js-comic-wrapper-position');

    const comicPageNodeList = comicNode.querySelectorAll('.js-comic-page');

    const prevLinkNodeList = document.querySelectorAll('.js-comic-prev-link');
    const nextLinkNodeList = document.querySelectorAll('.js-comic-next-link');

    const prevPageNodeList = document.querySelectorAll('.js-comic-prev-page');
    const nextPageNodeList = document.querySelectorAll('.js-comic-next-page');

    const prevIssueNodeList = document.querySelectorAll('.js-comic-prev-issue');
    const nextIssueNodeList = document.querySelectorAll('.js-comic-next-issue');

    const toggleDynamicViewsNode = document.querySelector('.js-comic-toggle-dynamic-views');
    const toggleFullScreenNode = document.querySelector('.js-comic-toggle-fullscreen');

    const currentPageNode = document.querySelector('.js-comic-current-page');

    const comicPageImageNodeList = document.querySelectorAll('.js-comic-page-image');

    let comic = [];

    let ratio = 688 / 1050;

    let state = {
        active: false,
        dynamicViews: false,
        fullscreen: false,
        width: 0,
        height: 0,
        pageWidth: 0,
        pageHeight: 0,
        nextLink: '#',
        prevLink: '#',
        currentPageId: 1,
        currentViewId: 1,
        images: {}
    };

    let pageViewsData = [];
    let currentViewData = [];

    let pageViewCount = 0;

    const getProperties = () => {

        state.width = comicNode.offsetWidth;
        state.height = comicNode.offsetHeight;
        state.pageWidth = comicPageNodeList[state.currentPageId - 1].offsetWidth;
        state.pageHeight = comicPageNodeList[state.currentPageId - 1].offsetHeight;

    };

    /**
     * Figure out where we are using the hash.
     */
    const getLocation = () => {

        let location = window.location.hash.substring(1).split('-');

        let pageId = Number(location[0]) || 1;
        let viewId = Number(location[1]) || 1;

        let fixHash = false;

        if (comic) {

            if (!comic[pageId - 1]) {
                pageId = comic.length;
                fixHash = true;
            }

            if (!comic[pageId - 1].views[viewId - 1]) {
                viewId = comic[pageId - 1].views.length;
                fixHash = true;
            }

        }

        if (fixHash) {
            window.location.hash = '#' + pageId + '-' + viewId;
        } else {
            setLocation(pageId, viewId);
        }

    };

    /**
     * Update state with the "location" of the comic and trigger some
     * follow up functions.
     *
     * @param  {number} page Page Id we're updating to
     * @param  {number} view View Id we're updating to
     */
    const setLocation = (page = state.currentPageId, view = state.currentViewId) => {

        if (state.currentPageId !== page) {

            positionPage();

            ga('send', 'event', 'Comic', 'page', page);

        }

        state.currentPageId = page;
        state.currentViewId = view;

        pageViewsData = comic[state.currentPageId - 1].views;
        currentViewData = pageViewsData[state.currentViewId - 1];

        pageViewCount = pageViewsData.length;

        // Update the links
        setLinks();

        // Update the DOM
        updatePage();

        // Load the next image
        loadImage(state.currentPageId + 1);
        // Load the previous image
        loadImage(state.currentPageId - 1);

    };

    const loadImage = (pageId) => {

        let image = state.images[pageId];

        if (image) {

            state.images[pageId].node.src = state.images[pageId].src;
            state.images[pageId].node.removeAttribute('data-src');

            delete state.images[pageId];

        }

    };

    // Using the state generate the links and update them in the DOM
    const setLinks = () => {

        let prevLink = '#1-1';
        let nextLink = `#${comic.length}-${comic[comic.length - 1].views.length}`;

        // Get the previous page/view link
        if (state.currentPageId > 1 || state.currentViewId > 1) {

            let prevPageId = state.currentPageId;
            let prevViewId = state.currentViewId - 1;

            if (state.currentViewId === 1) {
                prevPageId = state.currentPageId - 1;
                prevViewId = comic[prevPageId - 1].views.length;
            }

            if (!state.dynamicViews) {
                prevPageId = state.currentPageId - 1;
                prevViewId = 1;
            }

            prevLink = `#${prevPageId}-${prevViewId}`;

            forEach(prevLinkNodeList, function (index, prevLinkNode) {
                prevLinkNode.classList.remove('is-disabled');
            });

        } else {

            forEach(prevLinkNodeList, function (index, prevLinkNode) {
                prevLinkNode.classList.add('is-disabled');
            });

        }


        // Get the next page/view link
        if (!(state.currentPageId === comic.length &&
            ((state.dynamicViews && state.currentViewId === comic[comic.length - 1].views.length) || !state.dynamicViews))) {

            let nextPageId = state.currentPageId;
            let nextViewId = state.currentViewId + 1;

            if (state.currentViewId === pageViewCount || !state.dynamicViews) {
                nextPageId = state.currentPageId + 1;
                nextViewId = 1;
            }

            nextLink = `#${nextPageId}-${nextViewId}`;

            forEach(nextLinkNodeList, function (index, nextLinkNode) {
                nextLinkNode.classList.remove('is-disabled');
            });

        } else {

            forEach(nextLinkNodeList, function (index, nextLinkNode) {
                nextLinkNode.classList.add('is-disabled');
            });

        }

        state.prevLink = prevLink;
        state.nextLink = nextLink;

        forEach(nextLinkNodeList, function (index, value) {
            value.href = state.nextLink;
        });

        forEach(prevLinkNodeList, function (index, value) {
            value.href = state.prevLink;
        });

        currentPageNode.innerText = state.currentPageId;

    };

    /**
     * DOM updates for the page
     */
    const updatePage = () => {

        if (state.dynamicViews) {

            let pos = {
                x: Math.round((state.pageWidth - currentViewData.width) / 2) - currentViewData.left,
                y: Math.round((state.pageHeight - currentViewData.height) / 2) - currentViewData.top
            };

            let scaleX = Math.min(state.width / (currentViewData.width + 20), 2);
            let scaleY = Math.min(state.height / (currentViewData.height + 20), 2);

            let scale = scaleX > scaleY ? scaleY : scaleX;

            comicPositionNode.style.msTransform = `-ms-translate(${pos.x}px, ${pos.y}px, 0)`;
            comicPositionNode.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

            comicZoomNode.style.transform = `scale(${scale}, ${scale})`;

        }

        for (let i = 0; i < comicPageNodeList.length; i++) {

            let comicPageNode = comicPageNodeList[i];

            let display = i + 1 === state.currentPageId ? 'block' : 'none';

            comicPageNode.style.display = display;

        }

    };

    const positionPage = () => {

        document.body.scrollTop = document.querySelector('#comic').offsetTop - 20;

    };

    /**
     * Toggle the Dynamic Views and do appropriate cleanup
     */
    const toggleDynamicViews = (dynamicViewsState = !state.dynamicViews) => {

        state.dynamicViews = dynamicViewsState;

        if (!state.dynamicViews) {

            comicPositionNode.removeAttribute('style');
            comicZoomNode.removeAttribute('style');

            toggleDynamicViewsNode.classList.remove('is-active');
            comicNode.classList.remove('c-comic--theater');

            setCookie('dynamicViewsState', 0);

        } else {

            toggleDynamicViewsNode.classList.add('is-active');
            comicNode.classList.add('c-comic--theater');

            setCookie('dynamicViewsState', 1);

        }

        getProperties();

        setLocation();

        if (ga && isDesktop()) {
            ga('send', 'event', 'UX', 'dynamicViews', state.dynamicViews);
        }

    };

    // Update the location and prevent the hash from messing with things
    const handleHashchange = (e) => {

        e.preventDefault();

        getLocation();

    };

    const toggleFullscreen = () => {

        if (Modernizr.fullscreen) {

            if (!document.fullscreenElement && // alternative standard method
                !document.mozFullScreenElement &&
                !document.webkitFullscreenElement &&
                !document.msFullscreenElement) {  // current working methods

                if (comicNode.requestFullscreen) {
                    comicNode.requestFullscreen();
                } else if (comicNode.msRequestFullscreen) {
                    comicNode.msRequestFullscreen();
                } else if (comicNode.mozRequestFullScreen) {
                    comicNode.mozRequestFullScreen();
                } else if (comicNode.webkitRequestFullscreen) {
                    comicNode.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }

            state.fullscreen = !state.fullscreen;

            if (ga) {
                ga('send', 'event', 'UX', 'fullscreen', state.fullscreen);
            }

        }

    };


    //
    const handleKeydown = () => {

        const LEFT =  37;
        const RIGHT = 39;
        const SPACEBAR =  32;

        const ESC = 27;

        const F = 70;

        document.body.onkeydown = (e) => {

            if (e.keyCode === LEFT) {

                e.preventDefault();

                if (prevLinkNodeList) {
                    prevLinkNodeList[0].click();
                }

            } else if (e.keyCode === RIGHT || e.keyCode === SPACEBAR) {

                e.preventDefault();

                if (nextLinkNodeList) {
                    nextLinkNodeList[0].click();
                }

            }

        };

    };

    // Let's do this sheet
    const init = () => {

        if (comicNode) {

            getProperties();

            comic = comicData;

            forEach(comicPageImageNodeList, function (index, comicPageImageNode) {

                const src = comicPageImageNode.getAttribute('data-src');

                state.images[index + 1] = {
                    src: src,
                    node: comicPageImageNode
                };

            });

            getLocation();

            loadImage(state.currentPageId);

            handleKeydown();

            toggleDynamicViewsNode.addEventListener('click', function (e) {
                toggleDynamicViews();
            }, false);

            if (Modernizr.fullscreen) {

                toggleFullScreenNode.addEventListener('click', function () {
                    toggleDynamicViews(false);
                    toggleFullscreen();
                }, false);

            }

            window.addEventListener('hashchange', handleHashchange, false);

            window.addEventListener('resize', function () {
                getProperties();
                updatePage();
            }, false);

            if (getCookie('dynamicViewsState') == '1' || !isDesktop()) {
                toggleDynamicViews(true);
            }

            window.requestAnimationFrame(function () {
                state.active = true;
                comicNode.classList.remove('is-loading');
            });

        }

    };

    return {
        state,
        init
    };

};


const comicNode = document.querySelector('.js-comic');

if (comicNode) {

    // assign to the window so we can access it ;D
    window.mainComic = Comic(comicNode);

    mainComic.init();

}

const shareFacebookNode = document.querySelector('.js-share-facebook');

if (shareFacebookNode) {

    document.querySelector('.js-share-facebook').addEventListener('click', function () {

        FB.ui({
          method: 'share',
          href: URL,
        }, function (response) {});

        if (ga) {
            ga('send', 'event', 'Social', 'facebook');
        }

    });

}

const shareTwitterNode = document.querySelector('.js-share-twitter');

if (shareTwitterNode) {
    shareTwitterNode.addEventListener('click', function () {
        if (ga) {
            ga('send', 'event', 'Social', 'twitter');
        }
    });
}
