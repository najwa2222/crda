const express = require('express');
const { engine } = require('express-handlebars');
const mysql = require('mysql');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const client = require('prom-client'); // Correctly importing prom-client

const register = new promClient.Registry();
register.setDefaultLabels({
  app: 'monitoring-article',
});
// Initialization of the Express application
const app = express();

const httpRequestTimer = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  // buckets for response time from 0.1ms to 1s
  buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500, 1000],
});
app.get('/tweets', async (req, res) => {
  const start = Date.now();
  try {
  
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer.labels(req.method, req.route.path, res.statusCode.toString()).observe(responseTimeInMs);
  }
});
  // Start the timer
  const end = httpRequestDurationMicroseconds.startTimer();

  // Retrieve route from request object
  app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });
  // End timer and add labels
  end({ route, code: res.statusCode, method: req.method });




// Middleware to parse the request body in JSON and URL-encoded formats
app.use(express.json());


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
