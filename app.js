const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 8080;

var cors = require('cors')

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const loadCountries = () => {
  try {
    const data = fs.readFileSync('./data/countries.json', 'utf8');
    const parsedData = JSON.parse(data);
    return parsedData.countries;
  } catch (error) {
    console.error('Error loading countries:', error.message);
    return [];
  }
};

const saveCountries = (data) => {
  const updatedData = { countries: data };
  fs.writeFileSync('./data/countries.json', JSON.stringify(updatedData, null, 2));
};

app.get('/countries', (req, res) => {
  const countries = loadCountries();
  const countryList = countries.map((country, index) => ({
    id: index + 1, // Index as ID
    name: country.name,
    continent: country.continent,
  }));
  res.json(countryList);
});

app.get('/country/:id', (req, res) => {
  const { id } = req.params;
  const countries = loadCountries();
  const country = countries[id - 1]; // ID is index-based

  if (!country) {
    return res.status(404).json({ message: 'Country not found' });
  }

  res.json(country);
});

app.post('/country', upload.single('flag'), (req, res) => {
  const countries = loadCountries();
  const { name, rank, continent } = req.body;

  const errors = {};

  // Validate unique name and rank
  if (countries.find((c) => c.name === name)) {
    errors.name = 'Country name must be unique';
  }

  if (countries.find((c) => c.rank == rank)) {
    errors.rank = 'Rank must be unique';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const newCountry = {
    name,
    rank: parseInt(rank),
    continent,
    flag: req.file ? `images/${req.file.filename}` : null,
  };

  countries.push(newCountry);
  saveCountries(countries);

  res.status(201).json({ message: 'Country added successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
