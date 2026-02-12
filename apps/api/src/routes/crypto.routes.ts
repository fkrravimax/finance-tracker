import { Router } from 'express';
import { cryptoController } from '../controllers/crypto.controller.js';

const router = Router();

// GET /api/crypto/listings?limit=50&convert=USD
router.get('/listings', cryptoController.getListings);

// GET /api/crypto/global?convert=USD
router.get('/global', cryptoController.getGlobalMetrics);

// GET /api/crypto/fear-greed
router.get('/fear-greed', cryptoController.getFearGreedIndex);

// GET /api/crypto/quotes?symbols=BTC,ETH&convert=USD
router.get('/quotes', cryptoController.getQuotes);

// GET /api/crypto/info?symbols=BTC,ETH
router.get('/info', cryptoController.getInfo);

// GET /api/crypto/convert?amount=1&symbol=BTC&convert=IDR
router.get('/convert', cryptoController.convertPrice);

// GET /api/crypto/map?limit=200
router.get('/map', cryptoController.getMap);

export default router;
