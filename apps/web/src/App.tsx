import { Layout, Typography, Card, Row, Col, Tag, List } from 'antd'
import React, { useEffect, useState } from 'react'

import { api } from './api'

const { Header, Content } = Layout
const { Title, Paragraph } = Typography

type Health = { ok: boolean }
type Metric = { name: string; value: number | string; unit?: string }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [metrics, setMetrics] = useState<Metric[]>([])

  useEffect(() => {
    api
        .get('/api/health')
        .then(r => setHealth(r.data))
        .catch(() => setHealth({ ok: false }))

    api
        .get('/api/metrics')
        .then(r => setMetrics(r.data))
        .catch(() => setMetrics([]))
  }, [])

  return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff' }}>
          <Title level={3} style={{ margin: 0 }}>
            Organizational Health Dashboard
          </Title>
        </Header>
        <Content style={{ padding: 24 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card title='API Health'>
                <Paragraph>
                  Status:{' '}
                  {health
                      ? health.ok
                          ? <Tag color='green'>OK</Tag>
                          : <Tag color='red'>Down</Tag>
                      : '...'}
                </Paragraph>
              </Card>
            </Col>
            <Col span={8}>
              <Card title='Metrics'>
                {metrics.length > 0 ? (
                    <List<Metric>
                        size='small'
                        dataSource={metrics}
                        renderItem={(m) => (
                            <List.Item>
                              <strong>{m.name}:</strong> {m.value}
                              {m.unit ? ` ${m.unit}` : ''}
                            </List.Item>
                        )}
                    />
                ) : (
                    <Paragraph>No metrics available</Paragraph>
                )}
              </Card>
            </Col>
            <Col span={8}>
              <Card title='Insights'>
                <Paragraph>Coming soon…</Paragraph>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
  )
}