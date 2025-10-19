/// <reference lib="WebWorker" />
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching'

// Keep only offline precaching; notifications removed.
precacheAndRoute(self.__WB_MANIFEST)

