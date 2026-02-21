import { useCallback, useState } from 'react'

export function useLogin({fn, onSuccess}: { fn: (variables: any) => Promise<any>, onSuccess?: ({ data }: { data: any }) => void }) {
  const [submittedAt, setSubmittedAt] = useState<number | undefined>()
  const [variables, setVariables] = useState<any | undefined>()
  const [error, setError] = useState<any | undefined>()
  const [data, setData] = useState<any | undefined>()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  const submit = useCallback(async (variables: any): Promise<any> => {
    setStatus('pending')
    setSubmittedAt(Date.now())
    setVariables(variables)

    try {
      const data = await fn(variables)
      setData(data)
      setStatus('success')
      onSuccess?.({ data })

      return data
    } catch (error) {
      setError(error)
      setStatus('error')
    }
  }, [fn])
    
  return {
    submit,
    variables,
    error,
    data,
    status,
    submittedAt,
  }
}