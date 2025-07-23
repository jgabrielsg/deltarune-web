import songData from '$lib/data/song_book.json';

/** @type {import('./$types').PageLoad} */
export function load() {
  return {
    songbook: songData
  };
}