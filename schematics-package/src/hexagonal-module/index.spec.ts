import * as path from 'path';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Tree } from '@angular-devkit/schematics';

describe('hexagonal-module schematic --path behavior', () => {
  const collectionPath = path.join(__dirname, '..', '..', 'collection.json');
  const schematicName = 'hexagonal-module';

  it('should generate module under the provided --path (my-microservice-3/src/agnostic)', async () => {
    const runner = new SchematicTestRunner('@template/schematics', collectionPath);

    const appTree = new UnitTestTree(Tree.empty());

    const options = {
      name: 'agnostic',
      database: 'none',
      path: 'my-microservice-3/src',
    } as any;

    const tree = await runner.runSchematicAsync(schematicName, options, appTree).toPromise();

    expect(tree.exists('/my-microservice-3/src/agnostic/agnostic.module.ts')).toBe(true);
    // Ensure it did not place files at repository root by mistake
    expect(tree.exists('/agnostic.module.ts')).toBe(false);
    expect(tree.exists('/agnostic/agnostic.module.ts')).toBe(false);
  });
});
