import * as path from "path";
import { generateNamespace } from '@gql2ts/from-schema';
import * as fs from 'fs';
import { genSchema } from '../utils/generateSchema';
 
const typeScriptTypes = generateNamespace('GQL', genSchema());
fs.writeFile(path.join(__dirname, '../types/schema.d.ts'), typeScriptTypes, (e) => {console.log(e)});