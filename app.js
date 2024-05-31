const express = require('express');
const { engine } = require('express-handlebars');
const mysql = require('mysql');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const client = require('prom-client'); // Correctly importing prom-client

const register = new client.Registry(); // Use client.Registry instead of client

// Initialization of the Express application
const app = express();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'APP-nodejs-app'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create a histogram metric
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Register the histogram
register.registerMetric(httpRequestDurationMicroseconds);

// Define the HTTP server
const server = require('http').createServer(async (req, res) => {
  // Start the timer
  const end = httpRequestDurationMicroseconds.startTimer();

  // Retrieve route from request object
  const route = require('url').parse(req.url).pathname;

  if (route === '/metrics') {
    // Return all metrics in the Prometheus exposition format
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  }

  // End timer and add labels
  end({ route, code: res.statusCode, method: req.method });
});

// Start the HTTP server which exposes the metrics on http://localhost:9092/metrics
server.listen(9092);

// Middleware to parse the request body in JSON and URL-encoded formats
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure database connection information
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'najwa', // Replace with your MySQL username
  password: '0000', // Replace with your MySQL password
  database: 'base_crda'
});

// Establish a connection to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL server: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL server as ID ' + connection.threadId);
});

app.use(express.static('public'));
app.use(cors());
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index', { title: 'Home', layout: 'main' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'تسجيل الدخول', layout: 'main' });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.redirect("login?error=missing_credentials");
    return;
  }

  connection.query('SELECT * FROM utilisateur WHERE email_user = ? AND password_user = ?', [email, password], (error, results) => {
    if (error) {
      console.error('Error during query execution: ' + error.message);
      res.redirect("login?error=server_error");
      return;
    }
    if (results.length > 0) {
      res.render('services', { title: 'المحتوى', layout: 'main' });
    } else {
      res.redirect("login?error=incorrect_credentials");
    }
  });
});

app.get('/services', (req, res) => {
  res.render('services', { title: 'المحتوى', layout: 'main' });
});

app.post('/addservice', (req, res) => {
  const { prenom, nom, cin, numero_transaction, certificat_propriete_terre, copie_piece_identite_fermier, copie_piece_identite_nationale, demande_but, copie_contrat_location_terrain, autres_documents } = req.body;

  const fields = {
    prenom,
    nom,
    cin,
    numero_transaction,
    certificat_propriete_terre: certificat_propriete_terre === 'true',
    copie_piece_identite_fermier: copie_piece_identite_fermier === 'true',
    copie_piece_identite_nationale: copie_piece_identite_nationale === 'true',
    demande_but: demande_but === 'true',
    copie_contrat_location_terrain: copie_contrat_location_terrain === 'true',
    autres_documents: autres_documents === 'true'
  };

  const sql = 'INSERT INTO services_utilisateur (prenom, nom, cin, numero_transaction, certificat_propriete_terre, copie_piece_identite_fermier, copie_piece_identite_nationale, demande_but, copie_contrat_location_terrain, autres_documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  connection.query(sql, Object.values(fields), (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'exécution de la requête SQL : ' + err.message);
      res.redirect("services?error=database_error");
      return;
    }
    console.log('Nouvel enregistrement ajouté à la base de données avec l\'ID ' + result.insertId);

    if (fields.certificat_propriete_terre && fields.copie_piece_identite_fermier && fields.copie_piece_identite_nationale && fields.demande_but && fields.copie_contrat_location_terrain) {
      res.render('report');
    } else {
      res.redirect("services?error=document_incomplete");
    }
  });
});

app.get('/report', (req, res) => {
  res.render('report', { title: 'التقرير', layout: 'main' });
});

app.post('/rapportadd', (req, res) => {
  const { nom, prenom, cin, sujet, surface, limites_terrain, localisation, superficie_batiments_anciens, observations } = req.body;

  const sql = 'INSERT INTO rapportadd (nom, prenom, cin, sujet, surface, limites_terrain, localisation, superficie_batiments_anciens, observations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

  connection.query(sql, [nom, prenom, cin, sujet, surface, limites_terrain, localisation, superficie_batiments_anciens, observations], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'exécution de la requête SQL :', err);
      res.redirect("report?error=database_error");
      return;
    }
    console.log('Nouvel enregistrement ajouté à la base de données avec l\'ID ' + result.insertId);
    res.render('resultas');
  });
});

app.get('/resultas', (req, res) => {
  res.render('resultas', { title: 'نتيجة النهائية', layout: 'main' });
});

// Routes for users
app.use('/api/users', userRoutes);

// Routes for documents
app.use('/api/documents', documentRoutes);

// Middleware to handle 404 errors
app.use((req, res, next) => {
  const error = new Error('Ressource non trouvée');
  error.status = 404;
  next(error);
});

// Middleware to handle errors generated by other middleware
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    message: error.message || 'Erreur interne du serveur',
  });
});

// Start the server
const PORT = process.env.PORT || 4200;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
