const isAuthenticated = (req, res, next) => {
    if (req.session.userInfo)
        return next();
    else
        return res.status(401).json({ error: '로그인이 필요합니다.' });
}

module.exports = isAuthenticated;