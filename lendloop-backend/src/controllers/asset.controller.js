const assetService = require('../services/asset.service');
const { success } = require('../utils/response');

async function createAsset(req, res, next) {
  try {
    const asset = await assetService.createAsset(req.user.id, req.body);
    return success(res, 201, 'Asset created successfully', { asset });
  } catch (err) {
    return next(err);
  }
}

async function getAssets(req, res, next) {
  try {
    const result = await assetService.getAssets(req.query);
    return success(res, 200, 'Assets fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function getAssetById(req, res, next) {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    return success(res, 200, 'Asset fetched successfully', { asset });
  } catch (err) {
    return next(err);
  }
}

async function updateAsset(req, res, next) {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.user.id, req.body);
    return success(res, 200, 'Asset updated successfully', { asset });
  } catch (err) {
    return next(err);
  }
}

async function deleteAsset(req, res, next) {
  try {
    await assetService.deleteAsset(req.params.id, req.user.id);
    return success(res, 200, 'Asset deleted successfully', {});
  } catch (err) {
    return next(err);
  }
}

async function getNearbyAssets(req, res, next) {
  try {
    const result = await assetService.getNearbyAssets(req.query);
    return success(res, 200, 'Nearby assets fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function searchAssets(req, res, next) {
  try {
    const result = await assetService.searchAssets(req.query);
    return success(res, 200, 'Search results fetched successfully', result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getNearbyAssets,
  searchAssets,
};
