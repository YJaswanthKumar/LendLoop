const bcryptjs = require('bcryptjs');
const supabase = require('../config/supabase');
const { AppError } = require('../middleware/error.middleware');
const { generateToken, sanitizeUser } = require('../utils/helpers');

const SALT_ROUNDS = 10;

async function register(payload) {
  const { fullName, email, password, phone, city, state, country, latitude, longitude } = payload;

  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    throw new AppError('Failed to verify email availability', 500);
  }
  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const passwordHash = await bcryptjs.hash(password, SALT_ROUNDS);

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      full_name: fullName,
      email,
      password_hash: passwordHash,
      phone: phone || null,
      city: city || null,
      state: state || null,
      country: country || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    })
    .select()
    .single();

  if (insertError) {
    throw new AppError('Failed to create user account', 500);
  }

  const token = generateToken({ id: newUser.id, email: newUser.email });

  return { user: sanitizeUser(newUser), token };
}

async function login(email, password) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to process login', 500);
  }
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.is_active) {
    throw new AppError('This account has been deactivated', 403);
  }

  const isMatch = await bcryptjs.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({ id: user.id, email: user.email });

  return { user: sanitizeUser(user), token };
}

async function getProfile(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to fetch profile', 500);
  }
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return sanitizeUser(user);
}

module.exports = { register, login, getProfile };
