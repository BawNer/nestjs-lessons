import { User } from "@app/user/decorators/user.decorator";
import { AuthGuard } from "@app/user/guards/auth.guard";
import { UserEntity } from "@app/user/user.entity";
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ArticleService } from "./article.service";
import { CreateArticleDto } from "./dto/createArticle.dto";
import { UpdateArticleDto } from "./dto/updateArticle.dto";
import { ArticleResponseInterface } from "./types/articleResponse.interface";
import { ArticlesResponseInterface } from "./types/articlesResponse.interface";

@Controller('articles')
export class ArcticleController {
  constructor(
    private readonly articleService: ArticleService
  ) {}

  @Get()
  async findAll(@User('id') uid: number, @Query() query: any): Promise<ArticlesResponseInterface> {
    return await this.articleService.findAll(uid, query)
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async create(@User() currentUser: UserEntity, @Body('article') createArticleDto: CreateArticleDto): Promise<ArticleResponseInterface> {
    const article = await this.articleService.createArticle(currentUser, createArticleDto)
    return this.articleService.buildArticleResponse(article)
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string): Promise<ArticleResponseInterface> {
    const article = await this.articleService.findArticleBySlug(slug)
    return this.articleService.buildArticleResponse(article)
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  async deleteArticle(@User('id') uid: number, @Param('slug') slug: string) {
    return await this.articleService.deleteArticle(slug, uid)
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async updateArticle(@Param('slug') slug: string, @Body('article') updateArticleDto: UpdateArticleDto, @User('id') uid: number): Promise<ArticleResponseInterface> {
    const article = await this.articleService.updateArticleBySlug(slug, updateArticleDto, uid)
    return await this.articleService.buildArticleResponse(article)
  }

  @Post(':slug/favorite')
  @UseGuards(AuthGuard)
  async addArticleToFavorites(@User('id') uid: number, @Param('slug') slug: string): Promise<ArticleResponseInterface> {
    const article = await this.articleService.addArticleToFavorites(uid, slug)
    return await this.articleService.buildArticleResponse(article)
  }

  @Delete(':slug/favorite')
  @UseGuards(AuthGuard)
  async deleteArticleToFavorites (@User('id') uid: number, @Param('slug') slug: string): Promise<ArticleResponseInterface> {
    const article = await this.articleService.deleteArticleFromFavorites(uid, slug)
    return await this.articleService.buildArticleResponse(article)
  }
}