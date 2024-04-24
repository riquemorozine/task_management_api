import { ORMTransactionInstance } from '@domains/database/ORM';
import { IFoldersRepository } from '@domains/database/repositories/FoldersRepository/IFoldersRepository';
import { ICreateFolder } from '@domains/requests/folders/createFolder';

export class FoldersRepository implements IFoldersRepository {
  public async createFolder(
    folder: ICreateFolder,
    transaction: ORMTransactionInstance,
  ): Promise<void> {
    const { name, description, containerId, author } = folder;

    await transaction.folders.create({
      data: {
        name,
        description: description ? description : '',
        containerId,
        author,
      },
    });
  }
}
