import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import supabase from '../../api_server/src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readProductsFromCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

async function main() {
  try {
    
    const filePath = path.join(__dirname, '../data/products.csv');
    const data = await readProductsFromCSV(filePath);

    console.log(`Se encontraron ${data.length} productos en el archivo CSV.`);

    const productsToInsert = data.map(product => {
      const price50 = parseFloat(product.PRECIO_50_U);
      const price100 = parseFloat(product.PRECIO_100_U);
      const price200 = parseFloat(product.PRECIO_200_U);
      const stock = parseInt(product.CANTIDAD_DISPONIBLE, 10);

      const averagePrice = (price50 + price100 + price200) / 3;
      
      return {
        name: product.TIPO_PRENDA,
        talla: product.TALLA,
        color: product.COLOR,
        stock: isNaN(stock) ? 0 : stock,
        price: isNaN(averagePrice) ? 0 : averagePrice,
        disponible: product.DISPONIBLE === 'Si',
        categoria: product.CATEGORIA,
        description: product.DESCRIPCION
      };
    });

    console.log('Limpiando la tabla de productos existente...');
    const { error: deleteError } = await supabase.from('products').delete().gt('id', 0);
    if (deleteError) {
      console.error('Error limpiando la tabla:', deleteError);
      return;
    }

    console.log('Insertando nuevos productos en la base de datos...');
    const { data: insertedData, error: insertError } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select();

    if (insertError) {
      console.error('Error al insertar los productos:', insertError);
      return;
    }

    console.log(`¡Éxito! Se han insertado ${insertedData.length} productos en la base de datos.`);

  } catch (error) {
    console.error('Ha ocurrido un error inesperado en el script:', error);
  }
}

main();
