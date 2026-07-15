const authService = require('../services/auth.service');
const { success } = require('../utils/response');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return success(res, 201, 'User registered successfully', result);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, 200, 'Login successful', result);
  } catch (err) {
    return next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return success(res, 200, 'Profile fetched successfully', { user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, getProfile };
