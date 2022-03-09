import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserDto } from "@app/user/dto/createUser.dto";
import { UserEntity } from "@app/user/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { sign } from "jsonwebtoken";
import { JWT_SECRET } from "@app/config";
import { UserResponseInterfase } from "@app/user/types/userResponse.interface";
import { LoginUserDto } from "@app/user/dto/loginUser.dto";
import { compare } from 'bcrypt'
import { UpdateUserDto } from "./dto/updateUser.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userByEmail = await this.userRepository.findOne({
      email: createUserDto.email
    })
    const userByUsername = await this.userRepository.findOne({
      username: createUserDto.username
    })

    if ( userByEmail || userByUsername ) {
      throw new HttpException('Email or username are taken', HttpStatus.UNPROCESSABLE_ENTITY)
    }

    const newUser = new UserEntity()
    Object.assign(newUser, createUserDto)
    return await this.userRepository.save(newUser)
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<UserEntity> {

    const user = await this.userRepository.findOne({ email: loginUserDto.email }, { select: ['id', 'username', 'email', 'bio', 'password'] })
    
    if (!user) { throw new HttpException('Credentials are not valid', HttpStatus.UNPROCESSABLE_ENTITY) }

    const isPasswordCorrect = await compare(loginUserDto.password, user.password)

    if (!isPasswordCorrect) { throw new HttpException('Credentials are not valid', HttpStatus.UNPROCESSABLE_ENTITY) }

    delete user.password

    return user
  }

  async updateUser(updateUserDto: UpdateUserDto, uid: number): Promise<UserEntity> {
    const user = await this.findById(uid)
    this.userRepository.merge(user, updateUserDto)
    return await this.userRepository.save(user)
  }

  findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne(id)
  }

  generateJwt(user: UserEntity): string {
    return sign({
      id: user.id,
      username: user.username,
      email: user.email
    }, JWT_SECRET)
  }

  buildUserResponse(user: UserEntity): UserResponseInterfase {
    return {
      user: {
        ...user,
        token: this.generateJwt(user)
      }
    }
  }
}