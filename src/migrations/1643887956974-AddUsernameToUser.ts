import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUsernameToUser1643887956974 implements MigrationInterface {
    name = 'AddUsernameToUser1643887956974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }

}
