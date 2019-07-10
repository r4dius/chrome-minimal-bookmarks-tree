import { translateDocument } from '../common/functions';
import { buildTree, setElementDimensions } from './functions';
import Timeout = NodeJS.Timeout;
import {SettingsFactory} from '../common/settings';
import {clickHandler, contextMenuHandler, mouseDownHandler} from './handlers';
import {initDragDrop} from "./drag_drop";

(function init(settings, chrome) {
  let scrollTimeout: Timeout | null;
  const hideEmptyFolders: boolean = <boolean>settings.get('hide_empty_folders');
  const startWithAllFoldersClosed: boolean = <boolean>settings.get('start_with_all_folders_closed');
  const loading = <HTMLElement>document.querySelector('#loading');
  const bm = <HTMLElement>document.querySelector('#bookmarks');
  const wrapper = <HTMLElement>document.querySelector('#bookmarks');

  chrome.bookmarks.getTree((bookmarksTree) => {
    const otherBookmarks = buildTree(
      bookmarksTree[0].children[1],
      hideEmptyFolders,
      startWithAllFoldersClosed,
      true,
    );

    delete bookmarksTree[0].children[1];
    const bookmarksFolder = buildTree(
      bookmarksTree[0],
      hideEmptyFolders,
      startWithAllFoldersClosed,
      true,
    );

    if (bookmarksFolder) {
      bm.appendChild(bookmarksFolder);
      bm.childNodes.forEach((item: HTMLElement) => {
        if (item.nodeName !== 'LI') {
          return;
        }
        item.classList.add('nosort');
      });
    }
    if (otherBookmarks) {
      bm.appendChild(otherBookmarks);
    }

    if (settings.get('remember_scroll_position')) {
      const scrolltop = localStorage.getItem('scrolltop');
      if (null !== scrolltop) {
        setTimeout(() => { wrapper.scrollTop = parseInt(scrolltop, 10); }, 100);
      }
    }

    (bm as HTMLElement).style.display = 'block';
    loading.parentNode.removeChild(loading);
  });

  bm.addEventListener('click', (event) => clickHandler(event));
  bm.addEventListener('contextmenu', (event) => contextMenuHandler(event));
  bm.addEventListener('mousedown', (event) => mouseDownHandler(event));

  initDragDrop(bm, wrapper);

  if (settings.get('remember_scroll_position')) {
    wrapper.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { localStorage.setItem('scrolltop', String(wrapper.scrollTop)); }, 100);
    });
  }

  document.addEventListener('contextmenu', () => false);

  translateDocument(window.document);

  setElementDimensions(
    wrapper,
    parseInt(<string>settings.get('width'), 10),
    parseInt(<string>settings.get('height'), 10),
  );

  const font: string = <string>settings.get('font');
  if (font !== '__default__') {
    document.body.style.fontFamily = `"${font}"`;
  }

  document.body.classList.add(`theme--${settings.get('theme')}`);
}(SettingsFactory.create(), chrome));
