const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.route('/')
  .get(wishlistController.getWishlists)
  .post(wishlistController.createWishlist);

router.route('/:id')
  .patch(wishlistController.updateWishlist)
  .delete(wishlistController.deleteWishlist);

router.get('/:id/properties', wishlistController.getWishlistProperties);

router.route('/:id/properties/:propertyId')
  .post(wishlistController.addPropertyToWishlist)
  .delete(wishlistController.removePropertyFromWishlist);

module.exports = router;
