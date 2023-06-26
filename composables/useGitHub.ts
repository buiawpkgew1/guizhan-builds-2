import { Project } from 'guizhan-builds-data'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeStringify from 'rehype-stringify'

export function isMainBranch(branch: string): boolean {
  return ['master', 'main'].includes(branch)
}

export async function useGitHubReadme(project: Project): Promise<Ref<string | null>> {
  // 从 raw.githubusercontent.com 获取
  const { data } = await useFetch(
    `https://raw.githubusercontent.com/${project.author}/${project.repository}/${project.branch}/README.md`
  )
  useProjectReadmeLog(`fetched from raw.githubusercontent.com, ${data.value !== null ? 'success' : 'failed'}`)
  if (data.value) {
    return ref(data.value as string)
  }

  // 从 jsdelivr 获取
  const { data: data2 } = await useFetch(
    `https://cdn.jsdelivr.net/gh/${project.author}/${project.repository}@${project.branch}/README.md`
  )
  if (data2.value) {
    return ref(data2.value as string)
  }
  useProjectReadmeLog(`fetched from cdn.jsdelivr.net, ${data2.value !== null ? 'success' : 'failed'}`)

  return ref(null)
}

export async function useGitHubReadmeParsed(project: Project): Promise<Ref<string | null>> {
  const readme = await useGitHubReadme(project)
  if (readme.value === null) {
    return ref(null)
  }
  const parsed = await remark()
    .use(remarkGfm)
    .use(remarkEmoji)
    .use(remarkRehype, {
      allowDangerousHtml: true,
    })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeExternalLinks, {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    })
    .use(rehypeStringify)
    .process(readme.value)
  return ref(String(parsed.value))
}
