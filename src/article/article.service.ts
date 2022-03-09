import { UserEntity } from "@app/user/user.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, getRepository, Repository } from "typeorm";
import { ArticleEntity } from "./article.entity";
import { CreateArticleDto } from "./dto/createArticle.dto";
import { ArticleResponseInterface } from "./types/articleResponse.interface";
import slugify from 'slugify'
import { UpdateArticleDto } from "./dto/updateArticle.dto";
import { ArticlesResponseInterface } from "./types/articlesResponse.interface";

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async findAll(uid: number, query: any): Promise<ArticlesResponseInterface> {
    const queryBuilder = getRepository(ArticleEntity).createQueryBuilder('articles').leftJoinAndSelect('articles.author', 'author')

    queryBuilder.orderBy('articles.createdAt', 'DESC')

    const articlesCount = await queryBuilder.getCount()

    if ( query.tag ) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', { tag: `%${query.tag}%` })
    }

    if ( query.author ) {
      const author = await this.userRepository.findOne({username: query.author})
      queryBuilder.andWhere('articles.author.id = :id', { id: author.id })
    }

    if ( query.favorited ) {
      const author = await this.userRepository.findOne({ username: query.favorited }, { relations: ['favorites'] })
      const ids = author.favorites.map(el => el.id)
      if ( ids.length > 0 ) {
        queryBuilder.andWhere('articles.authorId IN (:...ids)', { ids })
      } else {
        queryBuilder.andWhere('1=0')
      }
    }
    
    if ( query.limit ) {
      queryBuilder.limit(query.limit)
    }

    if (query.offset) {
      queryBuilder.offset(query.offset)
    }

    let favoriteIds: number[] = []

    if (uid) {
      const currentUser = await this.userRepository.findOne(uid, { relations: ['favorites'] })
      favoriteIds = currentUser.favorites.map(favorite => favorite.id)
    }

    const articles = await queryBuilder.getMany()

    const articlesWithFavorites = articles.map(article => {
      const favorited = favoriteIds.includes(article.id)
      return {...article, favorited}
    })

    return { articles: articlesWithFavorites, articlesCount }
  }

  async createArticle(currentUser: UserEntity, cretaeArticleDto: CreateArticleDto): Promise<ArticleEntity> {
    const article = new ArticleEntity()
    Object.assign(article, cretaeArticleDto)

    if ( !article.tagList ) {
      article.tagList = []
    }

    article.slug = this.getSlug(cretaeArticleDto.title)

    article.author = currentUser

    return await this.articleRepository.save(article)
  }

  async findArticleBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne({slug})
  }

  async deleteArticle(slug: string, uid: number): Promise<DeleteResult> {
    const article = await this.findArticleBySlug(slug)

    if ( !article ) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND)
    }

    if ( article.author.id !== uid ) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN)
    }

    return await this.articleRepository.delete({slug})
  }

  async updateArticleBySlug(slug: string, updateArticleDto: UpdateArticleDto, uid: number): Promise<ArticleEntity> {
    const article = await this.findArticleBySlug(slug)

    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND)
    }

    if (article.author.id !== uid) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN)
    }

    article.slug = this.getSlug(updateArticleDto.title)

    Object.assign(article, updateArticleDto)

    return await this.articleRepository.save(article)
  }

  async addArticleToFavorites (uid: number, slug: string): Promise<ArticleEntity> {
    const article = await this.findArticleBySlug(slug)
    const user = await this.userRepository.findOne(uid, { relations: ['favorites'] })

    const isNotFavorite = user.favorites.findIndex(articleInFavorites  => articleInFavorites.id === article.id) === -1

    if ( isNotFavorite ) {
      user.favorites.push(article)
      article.favoritesCount++
      await this.userRepository.save(user)
      await this.articleRepository.save(article)
    }

    return article
  }

  async deleteArticleFromFavorites (uid: number, slug: string): Promise<ArticleEntity> {
    const article = await this.findArticleBySlug(slug)
    const user = await this.userRepository.findOne(uid, { relations: ['favorites'] })

    const articleIndex = user.favorites.findIndex(articleInFavorites => articleInFavorites.id === article.id)

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1)
      article.favoritesCount--
      await this.userRepository.save(user)
      await this.articleRepository.save(article)
    }

    return article
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article }
  }

  private getSlug(title: string): string {
    return slugify(title, { lower: true }) + '-' + ((Math.random() * Math.pow(36, 6) | 0).toString(36))
  }
}