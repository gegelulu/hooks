import { WebRouter } from '../web'

describe('WebRouter', () => {
  test('should exist', () => {
    expect(WebRouter).toBeTruthy()
    const router = new WebRouter('/', {
      routes: [
        {
          baseDir: 'lambda',
          basePath: '/api',
        },
      ],
    })
    expect(router).toBeInstanceOf(WebRouter)
  })

  test('test functions', () => {
    const router = new WebRouter('/', {
      source: 'src',
      routes: [
        {
          baseDir: 'lambda',
          basePath: '/api',
        },
      ],
    })
    expect(router.source.endsWith('/src')).toBeTruthy()

    const api = '/src/lambda/index.ts'
    expect(router.isLambdaFile(api)).toBeTruthy()
    expect(router.isLambdaFile(__dirname)).toBeFalsy()

    const rule = router.getRouteConfigBySourceFilePath(api)
    expect(rule).toMatchInlineSnapshot(`
      Object {
        "baseDir": "lambda",
        "basePath": "/api",
        "underscore": false,
      }
    `)
    expect(
      router.getLambdaDirectory(rule.baseDir).endsWith('src/lambda')
    ).toBeTruthy()
  })

  test('getHTTPPath', () => {
    const router = new WebRouter('/', {
      source: 'src',
      routes: [
        {
          baseDir: 'lambda',
          basePath: '/api',
        },
        {
          baseDir: 'render',
          basePath: '/',
        },
      ],
    })
    const api = '/src/lambda/index.ts'

    expect(router.getHTTPPath(api, '', true)).toMatchInlineSnapshot(`"/api"`)
    expect(router.getHTTPPath(api, 'foo', true)).toMatchInlineSnapshot(`"/api"`)
    expect(router.getHTTPPath(api, 'bar', false)).toMatchInlineSnapshot(
      `"/api/bar"`
    )

    const catchAll = '/src/render/[...index].ts'
    expect(router.getHTTPPath(catchAll, '', true)).toMatchInlineSnapshot(`"/*"`)
    expect(router.getHTTPPath(catchAll, 'foo', true)).toMatchInlineSnapshot(
      `"/*"`
    )
    expect(router.getHTTPPath(catchAll, 'bar', false)).toMatchInlineSnapshot(
      `"/bar/*"`
    )
  })
})