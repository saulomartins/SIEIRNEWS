const bcrypt = require('bcryptjs');

// Mock de banco de dados - Em produção, use um banco real
const users = [
  {
    id: 1,
    email: 'admin@sieirnews.com',
    password: bcrypt.hashSync('admin123', 10)
  },
  {
    id: 2,
    email: 'user@sieirnews.com',
    password: bcrypt.hashSync('user123', 10)
  }
];

const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

const verifyPassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

module.exports = {
  findUserByEmail,
  verifyPassword
};
