import * as core from '@actions/core'
import * as github from '@actions/github'
import * as slack from '@slack/web-api'
import { wait } from './wait'

const githubClient = github.getOctokit(core.getInput('token'))
const slackClient = new slack.WebClient(core.getInput('slackToken'))

const slackConversationId = core.getInput('slackConversationId')

export async function run(): Promise<void> {
  try {
    const selectedReviewer = selectRandomReviewer()

    await githubClient.rest.pulls.requestReviewers({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.issue.number,
      reviewers: [selectedReviewer.githubName]
    })
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function parseCandidates(candidates: string): { githubName: string }[] {
  return candidates.split(',').map(person => {
    const [githubName] = person.split(':')
    return { githubName }
  })
}

function getCandidates() {
  const candidates = core.getInput('candidates')
  return parseCandidates(candidates)
}

function selectRandomReviewer() {
  const prCreator = github.context.payload.pull_request?.user.login
  const candidateReviewer = getCandidates().filter(
    person => person.githubName !== prCreator
  )

  return candidateReviewer[Math.floor(Math.random() * candidateReviewer.length)]
}
