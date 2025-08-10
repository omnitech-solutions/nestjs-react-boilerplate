import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrganizationsTable1754871674504 implements MigrationInterface {
    name = 'CreateOrganizationsTable1754871674504'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`organizations\` (\`uuid\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`industry\` varchar(100) NULL, \`website\` varchar(2048) NULL, \`notes\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`organizations\``);
    }

}
