import { validate } from 'class-validator';
import { QueryCategoryDto } from './src/categories/dto/query-category.dto';

async function run() {
  const dto = new QueryCategoryDto();
  dto.marketplaceId = "";
  let errors = await validate(dto);
  console.log('empty string errors:', errors.length);

  const dto2 = new QueryCategoryDto();
  dto2.marketplaceId = "Null";
  let errors2 = await validate(dto2);
  console.log('Null errors:', errors2.length);
}
run();
