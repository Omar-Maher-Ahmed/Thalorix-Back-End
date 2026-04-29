import { validate } from 'class-validator';
import { QueryCategoryDto } from './src/categories/dto/query-category.dto';

async function run() {
  const dto = new QueryCategoryDto();
  dto.keyword = "test";
  let errors = await validate(dto);
  console.log('Valid DTO errors:', errors.length);

  const dto2 = new QueryCategoryDto();
  dto2.page = "invalid"; // Should ideally be numeric string if validated
  let errors2 = await validate(dto2);
  console.log('Invalid page errors:', errors2.length);
}
run();
