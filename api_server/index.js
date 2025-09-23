import app from './api.js'; // Import the app from the new file

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`API Server listening on port ${PORT}`);
});
