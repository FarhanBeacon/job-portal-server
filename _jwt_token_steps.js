/**
 * 1. After successful login, generate a JWT token and send it to the client
 *    npm install jsonwebtoken cookie-parser
 *    jwt.sign(playload, secretOrPrivatekey, { expriesIn: '1d' })
 *    Note: To generate a token, in terminal run-> 'node' and then run:
 *    'require('crypto').randomBytes(64).toString('hex')'
 *
 * 2. Send the token to client using cookie
 *    localStorage easier but is not secure, use httpOnly cookie
 *    res.cookie('token', token, { httpOnly: true, secure: true, sameSite:
 *    'Strict', maxAge: 3600000 }) // 1 hour
 *
 * 3. cors: npm install cors
 *    app.use(cors({ origin: 'http://localhost:5000', credentials: true }))
 *
 * 4. In the client side, use axios get/post/put/delete for secure APIs and
 *    must use 'withCredentials: true' in the request
 *
 * 5. Validate the token in the server side
 *    if valid: provide the data
 *    if not valid: logout the ueser
 *    create a middleware:
 *    const verifyJWT = (req, res, next) => {
 *    const token = req.cookies.token;
 *    jwt.verify(token, secretOrPrivatekey, (err, decoded) => {
 *    if (err) {}
 *    next();
 *   }
 */
