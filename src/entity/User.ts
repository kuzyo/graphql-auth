import * as bcrypt from "bcryptjs";

import {
  Entity,
  Column,
  BaseEntity,
  BeforeInsert,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column("varchar", { length: 255, nullable: true })
  email: string | null;

  @Column("text", { nullable: true })
  password: string | null;

  @Column("boolean", { default: false })
  confirmed: boolean;

  @Column("text", { nullable: true })
  googleId: string | null;

  @Column("boolean", { default: false })
  forgotPasswordLocked: boolean;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
